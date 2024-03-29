const testData = require("../db/data/test-data");
const seed = require("../db/seeds/seed");
const app = require("../app");
const request = require("supertest");
const connection = require("../db/connection");

beforeEach(() => seed(testData));

afterAll(() => connection.end());

describe("app", () => {
  describe("INVALID PATH", () => {
    test("Status 404 - Path not found ", () => {
      return request(app)
        .get("/api/invalid-endpoint")
        .expect(404)
        .then(({ body }) => {
          expect(body.message).toEqual("Path not found");
        });
    });
  });
  describe("GET /api", () => {
    test("Status 200 - Responds with a JSON description of all endpoints", () => {
      return request(app)
        .get("/api")
        .expect(200)
        .then(({ body: { endpoints } }) => {
          expect(endpoints).toEqual(
            expect.objectContaining({
              "GET /api": expect.any(Object),
              "GET /api/topics": expect.any(Object),
              "GET /api/users": expect.any(Object),
              "GET /api/articles": expect.any(Object),
              "GET /api/articles/:article_id": expect.any(Object),
              "PATCH /api/articles/:article_id": expect.any(Object),
              "GET /api/articles/:article_id/comments": expect.any(Object),
              "POST /api/articles/:article_id/comments": expect.any(Object),
              "DELETE /api/comments/:comment_id": expect.any(Object),
            })
          );
        });
    });
  });
  describe("GET /api/topics", () => {
    test("Status 200 - Responds with an array of objects with expected length", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          expect(topics).toHaveLength(3);
        });
    });
    test("Status 200 - Responds with an array of objects with correct properties", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          topics.forEach((topic) => {
            expect(topic).toEqual(
              expect.objectContaining({
                description: expect.any(String),
                slug: expect.any(String),
              })
            );
          });
        });
    });
  });
  describe("GET /api/users", () => {
    test("Status 200 - Responds with an array of users of expected length", () => {
      return request(app)
        .get("/api/users")
        .then(({ body: { users } }) => {
          expect(users).toHaveLength(4);
        });
    });
    test("Status 200 - Users have expected properties", () => {
      return request(app)
        .get("/api/users")
        .then(({ body: { users } }) => {
          users.forEach((user) => {
            expect(user).toEqual(
              expect.objectContaining({
                username: expect.any(String),
                name: expect.any(String),
                avatar_url: expect.any(String),
              })
            );
          });
        });
    });
  });
  describe("GET /api/articles", () => {
    test("Status 200 - Responds with an array of articles of expected length", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(12);
        });
    });
    test("Status 200 - Articles have expected properties", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).toEqual(
              expect.objectContaining({
                article_id: expect.any(Number),
                title: expect.any(String),
                topic: expect.any(String),
                author: expect.any(String),
                created_at: expect.any(String),
                votes: expect.any(Number),
              })
            );
          });
        });
    });
    test("Status 200 - Articles are sorted in descending date order", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("created_at", { descending: true });
        });
    });
    test("Status 200 - Articles have comment_count property", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).toEqual(
              expect.objectContaining({
                comment_count: expect.any(Number),
              })
            );
          });
        });
    });
    test("Status 200 - Articles have expected values", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0].comment_count).toEqual(2);
          expect(articles[5].comment_count).toEqual(11);
          expect(articles[11].comment_count).toEqual(0);
        });
    });
    test("Status 200 - Accepts order query which when set to asc returns articles in ascending order", () => {
      return request(app)
        .get("/api/articles?order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("created_at", {
            descending: false,
          });
        });
    });
    test("Status 200 - Accepts sort query that returns array sorted by specified column", () => {
      return request(app)
        .get("/api/articles?sort_by=author")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0].author).toBe("rogersop");
          expect(articles[11].author).toBe("butter_bridge");
        });
    });
    test("Status 200 - Accepts topic query that filters array by topic", () => {
      return request(app)
        .get("/api/articles?topic=mitch")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(11);
        });
    });
    test("Status 200 - Accepts all queries and returns an expected result", () => {
      return request(app)
        .get("/api/articles?sort_by=author&topic=mitch&order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(11);
          expect(articles[0].author).toBe("butter_bridge");
        });
    });
    test("Status 400 - Responds with message if sort parameter queries are invalid", () => {
      return request(app)
        .get("/api/articles?sort_by=autho")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid sort query");
        });
    });
    test("Status 400 - Responds with message if order parameter query values are invalid", () => {
      return request(app)
        .get("/api/articles?order=horizontal")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid order query");
        });
    });
  });
  describe("GET /api/articles/:article_id", () => {
    test("Status 200 - Responds with a single requested object", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(typeof article).toBe("object");
        });
    });
    test("Status 200 - Selected article has correct properties and values", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              article_id: 1,
              title: "Living in the shadow of a great man",
              topic: "mitch",
              author: "butter_bridge",
              body: "I find this existence challenging",
              created_at: "2020-07-09T20:11:00.000Z",
              votes: 100,
            })
          );
        });
    });
    test("Status 200 - Selected article has correct comment_count properties and values", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              comment_count: 11,
            })
          );
        });
    });
    test("Status 200 - Selected article has correct properties and values even without associated comments", () => {
      return request(app)
        .get("/api/articles/2")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              article_id: 2,
              title: "Sony Vaio; or, The Laptop",
              topic: "mitch",
              author: "icellusedkars",
              body: "Call me Mitchell. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would buy a laptop about a little and see the codey part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to coding as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the laptop. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the the Vaio with me.",
              created_at: expect.any(String),
              votes: 0,
              comment_count: 0,
            })
          );
        });
    });
    test("Status 404 - Responds with message to a valid but nonexistent id", () => {
      return request(app)
        .get("/api/articles/77777")
        .expect(404)
        .then(({ body: { message } }) => {
          expect(message).toBe("No resource found for article_id: 77777");
        });
    });
    test("Status 400 - Responds with message to an invalid id request", () => {
      return request(app)
        .get("/api/articles/invalidIdType")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid input");
        });
    });
  });
  describe("PATCH /api/articles/:article_id", () => {
    test("Status 200 - Responds with updated article with incremented votes", () => {
      const articleUpdate = { inc_votes: 1 };
      return request(app)
        .patch("/api/articles/1")
        .send(articleUpdate)
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              article_id: 1,
              title: "Living in the shadow of a great man",
              topic: "mitch",
              author: "butter_bridge",
              body: "I find this existence challenging",
              created_at: "2020-07-09T20:11:00.000Z",
              votes: 101,
            })
          );
        });
    });
    test("Status 200 - Responds with updated article with decremented votes", () => {
      const articleUpdate = { inc_votes: -1 };
      return request(app)
        .patch("/api/articles/1")
        .send(articleUpdate)
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              article_id: 1,
              title: "Living in the shadow of a great man",
              topic: "mitch",
              author: "butter_bridge",
              body: "I find this existence challenging",
              created_at: "2020-07-09T20:11:00.000Z",
              votes: 99,
            })
          );
        });
    });
    test("Status 400 - No inc_votes on request body", () => {
      return request(app)
        .patch("/api/articles/1")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Missing required data");
        });
    });
    test("Status 400 - Invalid input type of votes", () => {
      const articleUpdate = { inc_votes: "string" };
      return request(app)
        .patch("/api/articles/1")
        .send(articleUpdate)
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid input");
        });
    });
  });
  describe("GET /api/articles/article_id/comments", () => {
    test("Status 200 - Responds with an array of expected length for an article_id with comments", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          expect(comments).toHaveLength(11);
        });
    });
    test("Status 200 - Responds with an array with expected properties for an article_id with comments", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          comments.forEach((comment) => {
            expect(comment).toEqual(
              expect.objectContaining({
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                created_at: expect.any(String),
                author: expect.any(String),
                body: expect.any(String),
              })
            );
          });
        });
    });
    test("Status 200 - Responds with an empty array when article has no comments", () => {
      return request(app)
        .get("/api/articles/2/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          expect(comments).toHaveLength(0);
        });
    });
    test("Status 404 - Responds with a message if requested article does not exist", () => {
      return request(app)
        .get("/api/articles/77777/comments")
        .expect(404)
        .then(({ body: { message } }) => {
          expect(message).toBe("Resource not found");
        });
    });
    test("Status 400 - Responds with a message if input invalid", () => {
      return request(app)
        .get("/api/articles/invalidType/comments")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid input");
        });
    });
  });
  describe("POST /api/articles/article_id/comments", () => {
    test("Status 201 - Responds with the created comment", () => {
      const newComment = {
        username: "lurker",
        body: "What is this internet?",
      };
      return request(app)
        .post("/api/articles/2/comments")
        .send(newComment)
        .expect(201)
        .then(({ body: { createdComment } }) => {
          expect(createdComment).toEqual(
            expect.objectContaining({
              author: "lurker",
              body: "What is this internet?",
              article_id: 2,
              comment_id: 19,
              votes: 0,
              created_at: expect.any(String),
            })
          );
        });
    });
    test("Status 404 - Responds with message if article id does not exist", () => {
      const newComment = {
        username: "lurker",
        body: "What is this internet?",
      };
      return request(app)
        .post("/api/articles/77777/comments")
        .send(newComment)
        .expect(404)
        .then(({ body: { message } }) => {
          expect(message).toBe("Related resource does not exist");
        });
    });
    test("Status 400 - Responds with a message if invalid request parameter type", () => {
      const newComment = {
        username: "lurker",
        body: "What is this internet?",
      };
      return request(app)
        .post("/api/articles/invalidParameterType/comments")
        .send(newComment)
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid input");
        });
    });
    test("Status 400 - Responds with a message if invalid request data", () => {
      const newComment = {};
      return request(app)
        .post("/api/articles/2/comments")
        .send(newComment)
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Missing required data");
        });
    });
    test("Status 404 - Responds with a message if valid but non-existent username", () => {
      const newComment = {
        username: "nonexistentUser",
        body: "What is this internet?",
      };
      return request(app)
        .post("/api/articles/2/comments")
        .send(newComment)
        .expect(404)
        .then(({ body: { message } }) => {
          expect(message).toBe("Related resource does not exist");
        });
    });
  });
  describe("DELETE /api/comments/:comment_id", () => {
    test("Status 204 - Deletes a given comment", () => {
      return request(app)
        .delete("/api/comments/1")
        .expect(204)
        .then(() => {
          return connection.query(
            "SELECT * FROM comments WHERE comment_id =1;"
          );
        })
        .then((comments) => {
          expect(comments.rows[0]).toBe(undefined);
        });
    });
    test("Status 404 - Comment does not exist", () => {
      return request(app)
        .delete("/api/comments/77777")
        .expect(404)
        .then(({ body: { message } }) => {
          expect(message).toBe("Resource not found");
        });
    });
    test("Status 400 - Invalid input", () => {
      return request(app)
        .delete("/api/comments/invalidDataType")
        .expect(400)
        .then(({ body: { message } }) => {
          expect(message).toBe("Invalid input");
        });
    });
  });
});
