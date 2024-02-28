// TODO: TEST SOCKET CONNECTIONS FOR THE UPDATE TASK ROUTE
const express = require("express");
const router = express.Router();
const User = require("../../models/user/User");
const fetchUser = require("../../middlewares/fetchUser");
const Task = require("../../models/task/Task");
const { default: axios } = require("axios");
require("dotenv").config();

// ROUTE 5: create a subtask
router.post("/create", fetchUser, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: { code: 401, message: "Unauthorized operation." },
      });
    }

    const { taskId, title, desc } = req.body;

    // create a new task with 'create' route
    // Construct the full URL including the protocol, hostname, and port
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Make a request to the relative URL /data
    const response = await axios({
      url: `${baseUrl}/api/task/create`,
      method: "POST",
      headers: {
        authToken: req.header("authToken"),
      },
      data: {
        title,
        desc,
        subTask: true,
      },
    });

    const task = response.data.data.task;

    const parentTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $push: {
          subTask: task, // Push newValue into the arrayField
        },
      },
      { new: true }
    );

    res.status(200).json({
      data: {
        task: parentTask,
      },
    });
  } catch (error) {
    console.log("error in creating sub-task: ", error);
    res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error Occurred! Try again later",
      },
    });
  }
});

// ROUTE 2: delete a subtask
router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: { code: 401, message: "Unauthorized operation." },
      });
    }

    const id = req.params.id;
    const parent = req.query.parent;

    if (!parent)
      return res.status(401).json({
        error: {
          code: 401,
          message: "Main task is not defined.",
        },
      });

    //   sending request to delete the subtask from db and user model
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Make a request to the relative URL /data
    await axios({
      url: `${baseUrl}/api/task/delete/${id}`,
      method: "DELETE",
      headers: {
        authToken: req.header("authToken"),
      },
    });

    // const subTaskId = new mongoose.Types.ObjectId(subtask._id);
    // removing the subtask from main task
    await Task.findOneAndUpdate(
      { _id: parent },
      {
        $pull: {
          subTask: { _id: id },
        },
      }
    );

    res.status(200).json({
      data: {
        status: "Success",
      },
    });
  } catch (error) {
    console.log("error in delete subtask: ", error);
    res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error Occurred! Try again later",
      },
    });
  }
});

// ROUTE 3: get a subtask
// TO GET A SUBTASK, YOU CAN USE THE GET TASK ROUTE

// ROUTE 4: update a subtask
router.put("/create", fetchUser, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: { code: 401, message: "Unauthorized operation." },
      });
    }

    const { title, desc, updateType, status, taskId, parentId } = req.body;

    // old subtask
    const oldsubtask = await Task.findById(taskId);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Make a request to the relative URL /data
    const response = await axios({
      url: `${baseUrl}/api/task/create`,
      method: "PUT",
      headers: {
        authToken: req.header("authToken"),
      },
      data: {
        title,
        desc,
        updateType,
        status,
        taskId,
      },
    });

    // updating the array as there is no query to automate it
    const oldParent = await Task.findById(parentId);
    let newTasks = oldParent.subTask;

    const index = newTasks.findIndex(
      (task) => task._id.toString() === oldsubtask._id.toString()
    );

    newTasks[index] = response.data.data.task;

    // updating the parent task now
    const updatedParent = await Task.findByIdAndUpdate(
      parentId,
      {
        $set: {
          subTask: newTasks,
        },
      },
      { new: true }
    );

    res.status(200).json({
      data: {
        task: updatedParent,
      },
    });
  } catch (error) {
    console.log("Error in update sub-task route: ", error);
    res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error Occurred! Try again later.",
      },
    });
  }
});

module.exports = router;