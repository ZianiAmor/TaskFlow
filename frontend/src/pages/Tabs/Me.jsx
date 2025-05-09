import React, { useEffect, useState } from 'react';
import axiosInstance from "../../services/api";
import { 
  CircularProgressbar, 
  CircularProgressbarWithChildren, 
  buildStyles 
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Me = () => {
  const [stats, setStats] = useState({
    totalNumOfTasks: 0,
    tasksCompleted: 0,
    projectsCompleted: 0,
    pendingTasks: [],
    pendingProjects: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // The path should match what's defined in your router
        const latestTaskResponse = await axiosInstance.get('/api/tasks/stats');
        
        // Get the latest task data
        const latestTask = latestTaskResponse.data;
        
        // This path should also match your router - looks like it should be '/tasks'
        // instead of '/api/tasks'
        const tasksResponse = await axiosInstance.get('/api/tasks');
        const allTasks = tasksResponse.data;
        
        const pendingTasks = allTasks.filter(task => !task.isProject && !task.completed);
        const pendingProjects = allTasks.filter(task => task.isProject && !task.completed);
        
        setStats({
          totalNumOfTasks: latestTask?.totalNumOfTasks || 0,
          tasksCompleted: latestTask?.tasksCompleted || 0,
          projectsCompleted: latestTask?.projectsCompleted || 0,
          pendingTasks,
          pendingProjects
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Even if there's an error, still try to load tasks for display
        try {
          // This should also be '/tasks' to match your router definition
          const tasksResponse = await axiosInstance.get('/api/tasks');
          const allTasks = tasksResponse.data;
          
          const pendingTasks = allTasks.filter(task => !task.isProject && !task.completed);
          const pendingProjects = allTasks.filter(task => task.isProject && !task.completed);
          
          setStats(prevStats => ({
            ...prevStats,
            pendingTasks,
            pendingProjects
          }));
        } catch (tasksError) {
          console.error("Failed to load tasks as fallback:", tasksError);
        }
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();
    
    // Set up polling with a longer interval to reduce server load
    
  }, []);

  // Rest of the component remains the same
  // Calculate completion percentages
  const taskCompletionRate = stats.totalNumOfTasks > 0 
    ? Math.round((stats.tasksCompleted / stats.totalNumOfTasks) * 100) 
    : 0;
  
  const projectCompletionRate = stats.pendingProjects.length + stats.projectsCompleted > 0
    ? Math.round((stats.projectsCompleted / (stats.pendingProjects.length + stats.projectsCompleted)) * 100)
    : 0;
  
  // Calculate project progress with safety checks
  const calculateProjectProgress = (project) => {
    if (!project || !project.duration || project.duration <= 0) return 0;
    
    // Ensure progress array exists and has valid structure
    if (!project.progress || !Array.isArray(project.progress)) {
      return 0;
    }
    
    const totalProgress = project.progress.reduce((acc, day) => {
      // Check if day has the expected structure
      return acc + (day && typeof day.hours === 'number' ? day.hours : 0);
    }, 0);
    
    return Math.min(100, Math.round((totalProgress / project.duration) * 100));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading stats...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Performance Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2">Completed: <span className="font-medium">{stats.tasksCompleted}</span></p>
              <p className="mb-2">Total: <span className="font-medium">{stats.totalNumOfTasks}</span></p>
              <p className="mb-2">Pending: <span className="font-medium">{stats.pendingTasks.length}</span></p>
            </div>
            <div className="w-24 h-24">
              <CircularProgressbar 
                value={taskCompletionRate} 
                text={`${taskCompletionRate}%`}
                styles={buildStyles({
                  textSize: '16px',
                  pathColor: `rgba(62, 152, 199, ${taskCompletionRate / 100})`,
                  textColor: '#3e98c7',
                  trailColor: '#d6d6d6'
                })}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2">Completed: <span className="font-medium">{stats.projectsCompleted}</span></p>
              <p className="mb-2">Pending: <span className="font-medium">{stats.pendingProjects.length}</span></p>
              <p className="mb-2">Total: <span className="font-medium">{stats.projectsCompleted + stats.pendingProjects.length}</span></p>
            </div>
            <div className="w-24 h-24">
              <CircularProgressbar 
                value={projectCompletionRate} 
                text={`${projectCompletionRate}%`}
                styles={buildStyles({
                  textSize: '16px',
                  pathColor: `rgba(142, 68, 173, ${projectCompletionRate / 100})`,
                  textColor: '#8e44ad',
                  trailColor: '#d6d6d6'
                })}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Overall Productivity</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1">Tasks Due Soon: {stats.pendingTasks.filter(t => 
                new Date(t.deadline) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              ).length}</p>
              <p>Active Projects: {stats.pendingProjects.length}</p>
            </div>
            <div className="w-24 h-24">
              {stats.totalNumOfTasks > 0 ? (
                <CircularProgressbar 
                  value={(stats.tasksCompleted + stats.projectsCompleted)} 
                  maxValue={stats.totalNumOfTasks}
                  text={`${Math.round((stats.tasksCompleted + stats.projectsCompleted) / Math.max(1, stats.totalNumOfTasks) * 100)}%`}
                  styles={buildStyles({
                    textSize: '16px',
                    pathColor: '#27ae60',
                    textColor: '#27ae60',
                    trailColor: '#d6d6d6'
                  })}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Progress */}
      {stats.pendingProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Project Progress</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.pendingProjects.map(project => (
                <div key={project._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <span className="text-sm text-gray-500">
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-16 h-16 mr-4">
                      <CircularProgressbar
                        value={calculateProjectProgress(project)}
                        text={`${calculateProjectProgress(project)}%`}
                        styles={buildStyles({
                          textSize: '24px',
                          pathColor: `rgba(62, 152, 199, ${calculateProjectProgress(project) / 100})`,
                          textColor: '#3e98c7',
                          trailColor: '#d6d6d6'
                        })}
                      />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">
                          {project.progress && Array.isArray(project.progress) ? 
                            project.progress.reduce((acc, day) => acc + (day?.hours || 0), 0) : 0}
                        </span> of {project.duration} hours spent
                      </p>
                      <p className="text-sm text-gray-500">
                        {Math.max(0, project.duration - (project.progress && Array.isArray(project.progress) ? 
                          project.progress.reduce((acc, day) => acc + (day?.hours || 0), 0) : 0))} hours remaining
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Upcoming Tasks */}
      {stats.pendingTasks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Tasks</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Task</th>
                  <th className="text-left py-2">Deadline</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingTasks
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .map(task => (
                    <tr key={task._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{task.name}</td>
                      <td className="py-3">
                        {new Date(task.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-3">{task.duration} hours</td>
                      <td className="py-3">
                        <span 
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            task.priority < 6  ? 'bg-red-500' : 
                            task.priority  < 10 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        ></span>
                        {task.priority > 10 ? 'low' : task.priority < 6 ? 'High' : 'Meduim'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Monthly Performance</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Task Completion Rate</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48 h-48">
                  <CircularProgressbarWithChildren
                    value={taskCompletionRate}
                    styles={buildStyles({
                      pathColor: '#3498db',
                      trailColor: '#ecf0f1'
                    })}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-500">{stats.tasksCompleted}</div>
                      <div className="text-sm text-gray-500">of {stats.totalNumOfTasks} tasks</div>
                    </div>
                  </CircularProgressbarWithChildren>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Work Distribution</h3>
              <div className="h-64 flex flex-col justify-center">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Tasks</span>
                    <span className="text-sm font-medium">{stats.pendingTasks.length}</span>
                    </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${stats.pendingTasks.length + stats.pendingProjects.length > 0 ? 
                        Math.min(100, (stats.pendingTasks.length / (stats.pendingTasks.length + stats.pendingProjects.length)) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Projects</span>
                    <span className="text-sm font-medium">{stats.pendingProjects.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${stats.pendingTasks.length + stats.pendingProjects.length > 0 ? 
                        Math.min(100, (stats.pendingProjects.length / (stats.pendingTasks.length + stats.pendingProjects.length)) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Completed vs. Pending</span>
                    <span className="text-sm font-medium">{stats.tasksCompleted + stats.projectsCompleted} / {stats.pendingTasks.length + stats.pendingProjects.length + stats.tasksCompleted + stats.projectsCompleted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${(stats.tasksCompleted + stats.projectsCompleted + stats.pendingTasks.length + stats.pendingProjects.length) > 0 ? 
                        Math.min(100, ((stats.tasksCompleted + stats.projectsCompleted) / 
                        (stats.tasksCompleted + stats.projectsCompleted + stats.pendingTasks.length + stats.pendingProjects.length)) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Me;