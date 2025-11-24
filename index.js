require("./config/dbConnection");
const http = require("http");
const express = require("express");
const cors = require("cors");
const socketSetup = require("./services/socket.service");
const RootRouter = require("./routes/route");
const swagger = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.index");
const webpush = require("web-push");
const { PORT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY } = require("./environment/environment");

const app = express();

// setup web-notification
webpush.setVapidDetails(
  "mailto:ankitmori14@gmail.com",
  WEB_PUSH_PUBLIC_KEY,
  WEB_PUSH_PRIVATE_KEY
);

console.log('test')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

app.use("/api-docs", swagger.serve, swagger.setup(swaggerDocument));
app.use(RootRouter);

app.use("/", (req, res) => {
  res.json({
    message: "Welcome to the API. Visit /api-docs for documentation",
  });
});

const server = http.createServer(app);
socketSetup(server);

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
