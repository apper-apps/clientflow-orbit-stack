const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllTasks = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "title" } },
        { field: { Name: "priority" } },
        { field: { Name: "status" } },
        { field: { Name: "dueDate" } },
        { field: { Name: "projectId" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } }
      ],
      orderBy: [
        { fieldName: "CreatedOn", sorttype: "DESC" }
      ]
    };

    const response = await apperClient.fetchRecords("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    // Add mock time tracking data for backward compatibility
    const tasksWithTimeTracking = (response.data || []).map(task => ({
      ...task,
      timeTracking: {
        totalTime: 0,
        activeTimer: null,
        timeLogs: []
      }
    }));

    return tasksWithTimeTracking;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const getTaskById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "title" } },
        { field: { Name: "priority" } },
        { field: { Name: "status" } },
        { field: { Name: "dueDate" } },
        { field: { Name: "projectId" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } }
      ]
    };

    const response = await apperClient.getRecordById("task", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Task not found");
    }

    // Add mock time tracking data for backward compatibility
    return {
      ...response.data,
      timeTracking: {
        totalTime: 0,
        activeTimer: null,
        timeLogs: []
      }
    };
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    // Only include Updateable fields
    const record = {
      Name: taskData.Name || taskData.title,
      Tags: taskData.Tags,
      Owner: taskData.Owner,
      title: taskData.title,
      priority: taskData.priority || "medium",
      status: taskData.status || "todo",
      dueDate: taskData.dueDate,
      projectId: parseInt(taskData.projectId)
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.createRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create task");
      }
      
      return successfulRecords[0]?.data;
    }
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    // Only include Updateable fields plus Id
    const record = {
      Id: parseInt(id),
      Name: taskData.Name || taskData.title,
      Tags: taskData.Tags,
      Owner: taskData.Owner,
      title: taskData.title,
      priority: taskData.priority,
      status: taskData.status,
      dueDate: taskData.dueDate,
      projectId: parseInt(taskData.projectId)
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update task");
      }
      
      return successfulUpdates[0]?.data;
    }
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (id, status) => {
  try {
    const record = {
      Id: parseInt(id),
      status: status
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update task status");
      }
      
      return successfulUpdates[0]?.data;
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete task");
      }
      
      return successfulDeletions.length > 0;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Mock timer functions for backward compatibility - these would integrate with time_log table
export const startTaskTimer = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const now = new Date().toISOString();
  
  return {
    Id: parseInt(id),
    startTime: now
  };
};

export const stopTaskTimer = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const now = new Date().toISOString();
  const startTime = new Date(now - 3600000).toISOString(); // Mock 1 hour ago
  const duration = 3600000; // 1 hour in milliseconds

  return {
    Id: parseInt(id),
    startTime: startTime,
    endTime: now,
    duration: duration,
    date: new Date(startTime).toISOString().split('T')[0]
  };
};

export const getTaskTimeLogs = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Return empty array - would integrate with time_log table
  return [];
};