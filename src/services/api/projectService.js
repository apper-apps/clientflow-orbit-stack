const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllProjects = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "status" } },
        { field: { Name: "budget" } },
        { field: { Name: "startDate" } },
        { field: { Name: "endDate" } },
        { field: { Name: "clientId" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } }
      ],
      orderBy: [
        { fieldName: "CreatedOn", sorttype: "DESC" }
      ]
    };

    const response = await apperClient.fetchRecords("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const getProjectById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "status" } },
        { field: { Name: "budget" } },
        { field: { Name: "startDate" } },
        { field: { Name: "endDate" } },
        { field: { Name: "clientId" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } }
      ]
    };

    const response = await apperClient.getRecordById("project", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Project not found");
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching project with ID ${id}:`, error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    // Only include Updateable fields
    const record = {
      Name: projectData.Name || projectData.name,
      Tags: projectData.Tags,
      Owner: projectData.Owner,
      status: projectData.status || "planning",
      budget: parseFloat(projectData.budget) || 0,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      clientId: parseInt(projectData.clientId)
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.createRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create project");
      }
      
      return successfulRecords[0]?.data;
    }
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    // Only include Updateable fields plus Id
    const record = {
      Id: parseInt(id),
      Name: projectData.Name || projectData.name,
      Tags: projectData.Tags,
      Owner: projectData.Owner,
      status: projectData.status,
      budget: parseFloat(projectData.budget),
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      clientId: parseInt(projectData.clientId)
    };

    const params = {
      records: [record]
    };

    const response = await apperClient.updateRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update project");
      }
      
      return successfulUpdates[0]?.data;
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete project");
      }
      
      return successfulDeletions.length > 0;
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};