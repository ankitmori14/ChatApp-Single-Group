const { groupPaths, groupSchemas } = require("./group.swagger");

const swaggerDoc = {
  openapi: "3.0.0",
  host: "",
  info: {
    title: "Call app swagger",
    version: "1.2",
    description: "Call app swagger with Group Management and Messaging APIs",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local Server",
    },
    {
      url: "https://chatapp-single-group.onrender.com/",
      description: "Render server",
    },
  ],
  tags: [
    {
      name: "User",
      description: "Users All API Route",
    },
    {
      name: "Group",
      description: "Group Management and Messaging API Routes",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
    schemas: groupSchemas,
  },
  paths: {
    ...groupPaths,
    "/user/register": {
      post: {
        tags: ["User"],
        summary: "Register a new user",
        description: "Create a new user account with username, email, and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: {
                    type: "string",
                    example: "john_doe",
                    minLength: 3,
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                    minLength: 6,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "User registerd" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
                        username: { type: "string", example: "john_doe" },
                        email: { type: "string", example: "john@example.com" },
                        profileImage: { type: "string", example: "" },
                        isAvatarImageSet: { type: "boolean", example: false },
                        isOnline: { type: "boolean", example: false },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Duplicate email or validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: false },
                    message: { type: "string", example: "Duplicate email found" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: false },
                    message: { type: "string", example: "Something went worng!" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/user/login": {
      post: {
        tags: ["User"],
        summary: "User login",
        description: "Authenticate user and get JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successfully" },
                    data: {
                      type: "object",
                      properties: {
                        userData: {
                          type: "object",
                          properties: {
                            _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
                            username: { type: "string", example: "john_doe" },
                            email: { type: "string", example: "john@example.com" },
                            profileImage: { type: "string" },
                            isAvatarImageSet: { type: "boolean", example: false },
                            isOnline: { type: "boolean", example: true },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                        token: {
                          type: "string",
                          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid password",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: false },
                    message: { type: "string", example: "Password is invalid" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: false },
                    message: { type: "string", example: "User does not exist" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/setavatar": {
      post: {
        tags: ["User"],
        summary: "Set user profile avatar",
        description: "Update user's profile avatar image",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    example: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDov...",
                    description: "Base64 encoded image or image URL",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Avatar updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "Profile avatar updated" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        profileImage: { type: "string" },
                        isAvatarImageSet: { type: "boolean", example: true },
                        isOnline: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/allusers": {
      get: {
        tags: ["User"],
        summary: "Get all users",
        description: "Retrieve list of all users except the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User list retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "User List" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
                          username: { type: "string", example: "jane_doe" },
                          email: { type: "string", example: "jane@example.com" },
                          profileImage: { type: "string" },
                          isAvatarImageSet: { type: "boolean", example: true },
                          isOnline: { type: "boolean", example: false },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/chatHistory/{toUser}": {
      get: {
        tags: ["User"],
        summary: "Get chat history",
        description: "Retrieve chat message history between current user and another user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "toUser",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "60d5ec49f1b2c72b8c8e4f1a",
            },
            description: "User ID of the chat partner",
          },
        ],
        responses: {
          200: {
            description: "Chat history retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: { type: "string" },
                          message: { type: "string", example: "Hello, how are you?" },
                          fromUser: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
                          toUser: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1b" },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/pushNotification": {
      post: {
        tags: ["User"],
        summary: "Register push notification endpoint",
        description: "Register a push notification subscription endpoint for the current user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  endpoint: {
                    type: "string",
                    example: "https://fcm.googleapis.com/fcm/send/...",
                  },
                  expirationTime: {
                    type: "string",
                    nullable: true,
                  },
                  keys: {
                    type: "object",
                    properties: {
                      p256dh: { type: "string" },
                      auth: { type: "string" },
                    },
                  },
                },
                description: "Push subscription object from browser",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Push notification endpoint registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/sendMessageToUser": {
      post: {
        tags: ["User"],
        summary: "Send push notification to user",
        description: "Send a push notification message to a specific user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fromUser", "toUser", "message"],
                properties: {
                  fromUser: {
                    type: "string",
                    example: "60d5ec49f1b2c72b8c8e4f1a",
                    description: "Sender user ID",
                  },
                  toUser: {
                    type: "string",
                    example: "60d5ec49f1b2c72b8c8e4f1b",
                    description: "Recipient user ID",
                  },
                  message: {
                    type: "string",
                    example: "Hello! How are you?",
                    description: "Message content",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Push notification sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/logout": {
      post: {
        tags: ["User"],
        summary: "Logout user",
        description: "Logout current user and set status to offline",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "Logout successfully" },
                    data: { type: "null" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/user/getavatar": {
      get: {
        tags: ["User"],
        summary: "Get random avatar",
        description: "Generate a random avatar image from DiceBear API",
        responses: {
          200: {
            description: "Avatar generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "boolean", example: true },
                    message: { type: "string", example: "Avatar fetched" },
                    data: {
                      type: "object",
                      properties: {
                        svg: {
                          type: "string",
                          example: "<svg xmlns='http://www.w3.org/2000/svg'>...</svg>",
                          description: "SVG image data",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Failed to fetch avatar or internal server error",
          },
        },
      },
    },
  },
};

module.exports = swaggerDoc;  
