const app = require("../app");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const {
  categoryData,
  commentData,
  reviewData,
  userData,
} = require("../db/data/test-data/index");
beforeEach(() => seed({ categoryData, commentData, reviewData, userData }));
afterAll(() => {
  return db.end();
});
describe("3. GET /api/categories", () => {
  test("GET 200 - respond with the array of category objects", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then(({ body }) => {
        expect(body.length).toBe(4);
        body.forEach((category) => {
          expect(category).toMatchObject({
            slug: expect.any(String),
            description: expect.any(String),
          });
        });
      });
  });
});
describe("4. GET /api/reviews", () => {
  test("returns array of review objects including comment count", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        expect(body.length).toBe(13);
        body.forEach((review) => {
          expect(review).toMatchObject({
            title: expect.any(String),
            designer: expect.any(String),
            owner: expect.any(String),
            review_img_url: expect.any(String),
            category: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            comment_count: expect.any(String),
          });
        });
      });
  });
  test("the reviews are returned in descending order", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeSortedBy("created_at", { descending: true });
        expect(body[0].review_id).toBe(7);
      });
  });
});
describe("5. GET /api/reviews/:review_id", () => {
  test("GET 200 - responds with a review object with the correct properties", () => {
    return request(app)
      .get("/api/reviews/1")
      .expect(200)
      .then(({ body }) => {
        expect(body).toMatchObject({
          review_id: 1,
          title: "Agricola",
          category: "euro game",
          designer: "Uwe Rosenberg",
          owner: "mallionaire",
          review_body: "Farmyard fun!",
          review_img_url:
            "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png",
          created_at: "2021-01-18T10:00:20.514Z",
          votes: 1,
        });
      });
  });
  test("GET 400 - bad request, when the review_id is invalid", () => {
    return request(app)
      .get("/api/reviews/crumpet")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("bad request");
      });
  });
  test("GET 404 - id not found", () => {
    return request(app)
      .get("/api/reviews/500")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("id not found");
      });
  });
});
describe("6. GET /api/reviews/:review_id/comments", () => {
  test("should respond with an array of comments for the given review id with the correct properties - ordered by newest first", () => {
    return request(app)
      .get("/api/reviews/3/comments")
      .expect(200)
      .then(({ body }) => {
        body.forEach((item) => {
          expect(item).toMatchObject({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            review_id: expect.any(Number),
          });
        });
        expect(body).toBeSortedBy("created_at", { descending: true });
      });
  });
  test("expect an empty array to return when there are no comments with the given review_id", () => {
    return request(app)
      .get("/api/reviews/6/comments")
      .expect(200)
      .then(({ body }) => expect(body).toEqual([]));
  });
  test("GET 400 - bad request, when the review_id is invalid", () => {
    return request(app)
      .get("/api/reviews/crumpet/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("bad request");
      });
  });
  test("GET 404 - id not found", () => {
    return request(app)
      .get("/api/reviews/500/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("id not found");
      });
  });
});
describe.only("7. POST /api/reviews/:review_id/comments", () => {
  test("Request body should accept an object with the correct properties and respond with the posted comment", () => {
    return request(app)
      .post("/api/reviews/2/comments")
      .send({ username: "big-mad-andy", body: "yeah, it was alright" })
      .expect(201)
      .then(({ body }) => {
        expect(body).toMatchObject({
          comment_id: 7,
          author: "big-mad-andy",
          body: "yeah, it was alright",
          created_at: expect.any(String),
          review_id: 2,
          votes: 0,
        });
      });
  });
  test("POST 400 - the comment posted is missing required fields", () => {
    return request(app)
      .post("/api/reviews/2/comments")
      .send({ body: "yeah, it was alright" })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("bad request");
      });
  });
});

describe("ERROR 404 - end point not found", () => {
  test("if the end point is not found a message saying link not found is returned", () => {
    return request(app)
      .get("/sfjkbwkjdbwkjf")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("link not found");
      });
  });
});
