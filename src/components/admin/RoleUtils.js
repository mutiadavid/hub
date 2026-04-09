// // src/components/Dashboard/RoleUtils.js

// export const getNextRole = (currentRole) => {
//   const order = ["rm", "cocreator", "cochecker", "admin", "customer"];
//   const idx = order.indexOf(currentRole);
//   return idx === order.length - 1 ? order[0] : order[idx + 1];
// };

// export const getNextRoleLabel = (currentRole) => {
//   switch (currentRole) {
//     case "rm":
//       return "Make Cocreator";
//     case "cocreator":
//       return "Make Cochecker";
//     case "cochecker":
//       return "Make Admin";
//        case "customer":
//       return "rm";
//     default:
//       return "Make RM";
      
//   }
// };

// src/components/Dashboard/RoleUtils.js

export const getNextRole = (currentRole) => {
  const order = ["rm", "cocreator", "cochecker", "admin", "customer"];
  const idx = order.indexOf(currentRole);
  return idx === order.length - 1 ? order[0] : order[idx + 1];
};

export const getNextRoleLabel = (currentRole) => {
  switch (currentRole) {
    case "rm":
      return "Make Cocreator";
    case "cocreator":
      return "Make Cochecker";
    case "cochecker":
      return "Make Admin";
       case "customer":
      return "rm";
    default:
      return "Make RM";
      
  }
};
