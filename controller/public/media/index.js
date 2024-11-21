const models = require("@models");
const fs = require("fs");
const zlib = require("zlib");
const { createPath } = require("@utils");

const get = (req, res) => {
  const { id } = req.query;

  if (!id) {
    res.status(406).send("Requires file's id");
    return;
  }

  models.media
    .findOne({ where: { id } })
    .then((data) => {
      const headers = {
        "Accept-ranges": "bytes",
        "Content-Type": "image/jpeg",
        "Content-Length": data.size,
        "Content-Range": `0-*/${data.size}`,
      };
      const filePipe = fs.createReadStream(`${createPath(data.md5)}`);

      res.set(headers);
      if (!!req.acceptsEncodings("gzip")) {
        res.setHeader("Content-Encoding", "gzip");
        filePipe.pipe(zlib.createGzip()).pipe(res);
      } else if (!!req.acceptsEncodings("deflate")) {
        res.setHeader("Content-Encoding", "deflate");
        filePipe.pipe(zlib.createDeflate()).pipe(res);
      } else if (!!req.acceptsEncodings("br")) {
        res.setHeader("Content-Encoding", "brotli");
        filePipe.pipe(zlib.createBrotliCompress()).pipe(res);
      } else {
        filePipe.pipe(res);
      }
    })
    .catch((err) => {
      res.status(401).send("NOT FOUND");
    });
};

module.exports = (router) => {
  router.get("/", get);
};
