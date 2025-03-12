// frontend/src/utils/taskUtils.js
const outdoorKeywords = [
    "hiking", "walking", "jogging", "running", "cycling", "swimming", "camping", 
    "kayaking", "fishing", "climbing", "yoga", "surfing", "skiing", "snowboarding", 
    "gardening", "picnic", "barbecue", "visit", "visiting", "walk", "going", 
    "workout", "shopping", "park", "beach", "trail", "lake", "forest", "mountain", 
    "river", "garden", "playground", "pool", "campsite", "zoo", "farm", "hangout", 
    "gym", "tennis", "golf", "soccer", "volleyball", "basketball", "baseball", 
    "skateboarding", "badminton", "training", "bootcamp", "birdwatching", "stargazing", 
    "photography", "foraging", "bonfire", "sunset", "sunrise", "wildlife", "nature walk", 
    "scenic drive", "boating", "rafting", "snorkeling", "paddleboarding", "sailing", 
    "diving", "tubing", "waterskiing", "jet skiing", "kitesurfing", "sledding", 
    "ice skating", "snowshoeing", "leaf peeping"
  ];
  
  const mapRelevantActivities = [
    "shopping", "gym", "park", "restaurant", "cafe", "mall", "fitness", 
    "workout", "sports", "pool", "tennis", "golf", "basketball", 
    "soccer", "beach", "lake", "cinema", "theater", "museum"
  ];
  
  export const isOutdoorActivity = (taskName) => {
    const pattern = `\\b(${outdoorKeywords.join("|")})\\b`;
    return new RegExp(pattern, "i").test(taskName);
  };
  
  export const requiresMapDisplay = (taskName) => {
    const lowerName = taskName.toLowerCase();
    return mapRelevantActivities.some(activity => lowerName.includes(activity));
  };
  
  export const determineActivityType = (taskName) => {
    const lowerName = taskName.toLowerCase();
    if (lowerName.includes("gym")) return "gym";
    if (lowerName.includes("shopping")) return "supermarket";
    if (lowerName.includes("restaurant")) return "restaurant";
    if (lowerName.includes("cafe")) return "cafe";
    if (lowerName.includes("motel")) return "motel";
    return "default";
  };
  