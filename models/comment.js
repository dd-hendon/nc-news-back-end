const db = require("../db/connection");

exports.selectCommentsByArticleId = async (id) => {
  const comments = await db.query(
    "SELECT * FROM comments WHERE article_id = $1",
    [id]
  );
  return comments.rows;
};

exports.createComment = async (comment, id) => {
  const { body, username } = comment;
  const createdComment = await db.query(
    `
  INSERT INTO comments (body, author, article_id)
  VALUES ($1, $2, $3) RETURNING *;`,
    [body, username, id]
  );
  return createdComment.rows[0];
};
