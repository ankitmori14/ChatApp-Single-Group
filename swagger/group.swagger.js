// Group Management Swagger Documentation

const groupPaths = {
  "/group/create": {
    post: {
      tags: ["Group"],
      summary: "Create a new group",
      description: "Create a new group with specified name, type (private/open), and maximum members",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type"],
              properties: {
                name: {
                  type: "string",
                  minLength: 3,
                  maxLength: 50,
                  example: "My Awesome Group",
                },
                type: {
                  type: "string",
                  enum: ["private", "open"],
                  example: "private",
                },
                maxMembers: {
                  type: "number",
                  minimum: 2,
                  nullable: true,
                  example: 50,
                  description: "Maximum number of members (null for unlimited)",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Group created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Group created successfully" },
                  data: { $ref: "#/components/schemas/Group" },
                },
              },
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/my-groups": {
    get: {
      tags: ["Group"],
      summary: "Get user's groups",
      description: "Retrieve all groups the current user is a member of",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "User groups retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "User groups retrieved" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Group" },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}": {
    get: {
      tags: ["Group"],
      summary: "Get group details",
      description: "Retrieve detailed information about a specific group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Group details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Group details retrieved" },
                  data: { $ref: "#/components/schemas/GroupDetails" },
                },
              },
            },
          },
        },
        403: { description: "Not a member of private group" },
        404: { description: "Group not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    delete: {
      tags: ["Group"],
      summary: "Delete group",
      description: "Delete a group (owner only, must be sole member)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Group deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Group deleted successfully" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Only owner can delete group" },
        404: { description: "Group not found" },
        409: { description: "Group can only be deleted when you are the sole member" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/members": {
    get: {
      tags: ["Group"],
      summary: "Get group members",
      description: "Retrieve list of all members in a group (members only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Group members retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Group members retrieved" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
        403: { description: "Must be a member to view members" },
        404: { description: "Group not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/join": {
    post: {
      tags: ["Group"],
      summary: "Join group or request to join",
      description: "Join an open group immediately or submit a join request for a private group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Joined group or request submitted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Joined group successfully",
                  },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Cooldown active or user banned" },
        404: { description: "Group not found" },
        409: { description: "Already a member or group is full" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/leave": {
    post: {
      tags: ["Group"],
      summary: "Leave group",
      description: "Leave a group (owner must transfer ownership first)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Left group successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Left group successfully" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        404: { description: "Group not found" },
        409: { description: "Not a member or owner must transfer ownership first" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/banish": {
    post: {
      tags: ["Group"],
      summary: "Banish member",
      description: "Banish a member from the group (owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId"],
              properties: {
                userId: {
                  type: "string",
                  example: "60d5ec49f1b2c72b8c8e4f1a",
                  description: "User ID to banish",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Member banished successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Member banished successfully" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Only owner can banish members" },
        404: { description: "Group not found" },
        409: { description: "User is not a member or owner cannot banish themselves" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/transfer": {
    post: {
      tags: ["Group"],
      summary: "Transfer ownership",
      description: "Transfer group ownership to another member (owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["newOwnerId"],
              properties: {
                newOwnerId: {
                  type: "string",
                  example: "60d5ec49f1b2c72b8c8e4f1a",
                  description: "User ID of new owner",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Ownership transferred successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Ownership transferred successfully" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Only owner can transfer ownership" },
        404: { description: "Group not found" },
        409: { description: "New owner must be a member" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/requests": {
    get: {
      tags: ["Group"],
      summary: "Get join requests",
      description: "Get all pending join requests for a group (owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Join requests retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Join requests retrieved" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/GroupJoinRequest" },
                  },
                },
              },
            },
          },
        },
        403: { description: "Only owner can view join requests" },
        404: { description: "Group not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/approve": {
    post: {
      tags: ["Group"],
      summary: "Approve join request",
      description: "Approve a pending join request (owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["requestId"],
              properties: {
                requestId: {
                  type: "string",
                  example: "60d5ec49f1b2c72b8c8e4f1a",
                  description: "Join request ID",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Join request approved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Join request approved" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Only owner can approve requests" },
        404: { description: "Group or request not found" },
        409: { description: "Group has reached maximum capacity" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/decline": {
    post: {
      tags: ["Group"],
      summary: "Decline join request",
      description: "Decline a pending join request (owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["requestId"],
              properties: {
                requestId: {
                  type: "string",
                  example: "60d5ec49f1b2c72b8c8e4f1a",
                  description: "Join request ID",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Join request declined successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Join request declined" },
                  data: { type: "null" },
                },
              },
            },
          },
        },
        403: { description: "Only owner can decline requests" },
        404: { description: "Group or request not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/message": {
    post: {
      tags: ["Group"],
      summary: "Send group message",
      description: "Send a message to a group (members only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: {
                  type: "string",
                  minLength: 1,
                  maxLength: 5000,
                  example: "Hello everyone!",
                  description: "Message content",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Message sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Message sent successfully" },
                  data: { $ref: "#/components/schemas/GroupMessage" },
                },
              },
            },
          },
        },
        403: { description: "Must be a member to send messages" },
        404: { description: "Group not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/group/{groupId}/messages": {
    get: {
      tags: ["Group"],
      summary: "Get group messages",
      description: "Retrieve message history for a group (members only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "number", default: 50 },
          description: "Number of messages to retrieve",
        },
        {
          name: "skip",
          in: "query",
          schema: { type: "number", default: 0 },
          description: "Number of messages to skip (for pagination)",
        },
      ],
      responses: {
        200: {
          description: "Messages retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "boolean", example: true },
                  message: { type: "string", example: "Messages retrieved" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/GroupMessage" },
                  },
                },
              },
            },
          },
        },
        403: { description: "Must be a member to view messages" },
        404: { description: "Group not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
};

const groupSchemas = {
  Group: {
    type: "object",
    properties: {
      _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
      name: { type: "string", example: "My Awesome Group" },
      type: { type: "string", enum: ["private", "open"], example: "private" },
      owner: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1b" },
      members: {
        type: "array",
        items: { type: "string" },
        example: ["60d5ec49f1b2c72b8c8e4f1b", "60d5ec49f1b2c72b8c8e4f1c"],
      },
      bannedUsers: {
        type: "array",
        items: { type: "string" },
        example: [],
      },
      maxMembers: { type: "number", nullable: true, example: 50 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  GroupDetails: {
    type: "object",
    properties: {
      _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
      name: { type: "string", example: "My Awesome Group" },
      type: { type: "string", enum: ["private", "open"], example: "private" },
      owner: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          profileImage: { type: "string" },
        },
      },
      members: {
        type: "array",
        items: { type: "string" },
      },
      bannedUsers: {
        type: "array",
        items: { type: "string" },
      },
      maxMembers: { type: "number", nullable: true, example: 50 },
      memberCount: { type: "number", example: 5 },
      isOwner: { type: "boolean", example: false },
      isMember: { type: "boolean", example: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  GroupJoinRequest: {
    type: "object",
    properties: {
      _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
      user: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string", example: "john_doe" },
          email: { type: "string", example: "john@example.com" },
          profileImage: { type: "string" },
        },
      },
      group: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1b" },
      status: {
        type: "string",
        enum: ["pending", "approved", "declined"],
        example: "pending",
      },
      requestedAt: { type: "string", format: "date-time" },
      processedAt: { type: "string", format: "date-time", nullable: true },
      processedBy: { type: "string", nullable: true },
    },
  },
  GroupMessage: {
    type: "object",
    properties: {
      _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
      message: { type: "string", example: "Hello everyone!" },
      fromUser: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string", example: "john_doe" },
          email: { type: "string", example: "john@example.com" },
          profileImage: { type: "string" },
        },
      },
      group: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1b" },
      messageType: { type: "string", enum: ["direct", "group"], example: "group" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    properties: {
      _id: { type: "string", example: "60d5ec49f1b2c72b8c8e4f1a" },
      username: { type: "string", example: "john_doe" },
      email: { type: "string", example: "john@example.com" },
      profileImage: { type: "string" },
      isOnline: { type: "boolean", example: true },
    },
  },
};

module.exports = { groupPaths, groupSchemas };
