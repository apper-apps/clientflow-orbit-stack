import { startTaskTimer, stopTaskTimer, getTaskTimeLogs } from "@/services/api/taskService";
import { getAllTasks } from "@/services/api/taskService";

const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Get all time log records from database
export const getAllTimeLogs = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "task_id" } },
        { field: { Name: "start_time" } },
        { field: { Name: "end_time" } },
        { field: { Name: "duration" } },
        { field: { Name: "date" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } }
      ],
      orderBy: [
        { fieldName: "start_time", sorttype: "DESC" }
      ]
    };

    const response = await apperClient.fetchRecords("time_log", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching time logs:", error);
    throw error;
  }
};

// Create time log entry
export const createTimeLog = async (timeLogData) => {
  try {
    const record = {
      Name: timeLogData.Name || `Time Log ${Date.now()}`,
      Tags: timeLogData.Tags,
      Owner: timeLogData.Owner,
      task_id: parseInt(timeLogData.task_id),
      start_time: timeLogData.start_time,
      end_time: timeLogData.end_time,
      duration: timeLogData.duration,
      date: timeLogData.date
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.createRecord("time_log", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create time log");
      }
      
      return successfulRecords[0]?.data;
    }
  } catch (error) {
    console.error("Error creating time log:", error);
    throw error;
  }
};

export const startTimer = async (taskId) => {
  try {
    const timerData = await startTaskTimer(taskId);
    return timerData;
  } catch (error) {
    throw new Error(`Failed to start timer: ${error.message}`);
  }
};

export const stopTimer = async (taskId) => {
  try {
    const timeLog = await stopTaskTimer(taskId);
    
    // Create time log entry in database
    await createTimeLog({
      task_id: taskId,
      start_time: timeLog.startTime,
      end_time: timeLog.endTime,
      duration: timeLog.duration,
      date: timeLog.date
    });
    
    return timeLog;
  } catch (error) {
    throw new Error(`Failed to stop timer: ${error.message}`);
  }
};

export const getActiveTimer = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const tasks = await getAllTasks();
  const task = tasks.find(t => t.Id === parseInt(taskId));
  
  if (!task) {
    throw new Error("Task not found");
  }

  return task.timeTracking?.activeTimer || null;
};

export const getTimeLogs = async (taskId) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "task_id" } },
        { field: { Name: "start_time" } },
        { field: { Name: "end_time" } },
        { field: { Name: "duration" } },
        { field: { Name: "date" } }
      ],
      where: [
        {
          FieldName: "task_id",
          Operator: "EqualTo",
          Values: [parseInt(taskId)]
        }
      ],
      orderBy: [
        { fieldName: "start_time", sorttype: "DESC" }
      ]
    };

    const response = await apperClient.fetchRecords("time_log", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error(`Failed to get time logs: ${error.message}`);
    throw error;
  }
};

export const getProjectTimeTracking = async (projectId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const tasks = await getAllTasks();
    const projectTasks = tasks.filter(t => t.projectId === String(projectId));
    
    let totalTime = 0;
    let activeTimers = 0;
    let totalEntries = 0;
    const timeLogs = [];

    // Get time logs from database for project tasks
    for (const task of projectTasks) {
      try {
        const taskTimeLogs = await getTimeLogs(task.Id);
        totalEntries += taskTimeLogs.length;
        
        taskTimeLogs.forEach(log => {
          totalTime += log.duration || 0;
          timeLogs.push({
            ...log,
            taskId: task.Id,
            taskTitle: task.title
          });
        });
        
        if (task.timeTracking?.activeTimer) {
          activeTimers++;
        }
      } catch (error) {
        console.error(`Error getting time logs for task ${task.Id}:`, error);
      }
    }

    // Sort time logs by date (newest first)
    timeLogs.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));

    return {
      totalTime,
      activeTimers,
      totalEntries,
      timeLogs: timeLogs.slice(0, 10) // Return last 10 entries
    };
  } catch (error) {
    throw new Error(`Failed to get project time tracking: ${error.message}`);
  }
};

export const getAllTimeTracking = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const tasks = await getAllTasks();
    const allTimeLogs = await getAllTimeLogs();
    
    const summary = {
      totalTime: 0,
      activeTimers: 0,
      totalEntries: allTimeLogs.length,
      taskBreakdown: []
    };

    // Calculate total time from database time logs
    allTimeLogs.forEach(log => {
      summary.totalTime += log.duration || 0;
    });

    // Group time logs by task
    const taskTimeMap = new Map();
    allTimeLogs.forEach(log => {
      const taskId = log.task_id;
      if (!taskTimeMap.has(taskId)) {
        taskTimeMap.set(taskId, {
          totalTime: 0,
          entryCount: 0,
          logs: []
        });
      }
      const taskTime = taskTimeMap.get(taskId);
      taskTime.totalTime += log.duration || 0;
      taskTime.entryCount++;
      taskTime.logs.push(log);
    });

    tasks.forEach(task => {
      const taskTimeData = taskTimeMap.get(task.Id) || { totalTime: 0, entryCount: 0 };
      const hasActiveTimer = !!task.timeTracking?.activeTimer;
      
      if (hasActiveTimer) {
        summary.activeTimers++;
      }

      if (taskTimeData.totalTime > 0 || hasActiveTimer) {
        summary.taskBreakdown.push({
          taskId: task.Id,
          taskTitle: task.title,
          projectId: task.projectId,
          totalTime: taskTimeData.totalTime,
          hasActiveTimer: hasActiveTimer,
          entryCount: taskTimeData.entryCount
        });
      }
    });

    // Sort by total time descending
    summary.taskBreakdown.sort((a, b) => b.totalTime - a.totalTime);

    return summary;
  } catch (error) {
    throw new Error(`Failed to get all time tracking data: ${error.message}`);
  }
};