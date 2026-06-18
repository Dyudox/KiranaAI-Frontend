import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const PermissionGate = ({ menuKey, action, children }) => {
  const { userPermissions } = useContext(AuthContext);

  // Cari permission untuk menu yang diminta
  const permission = userPermissions?.find((p) => p.menu_key === menuKey);

  // console.log(`Debug - Menu: ${menuKey}, Action yang diminta: ${action}`);
  // console.log("Debug - Objek Permission ditemukan:", permission);

  // Langsung gunakan 'action' karena nama action (can_create, dll)
  // sudah sama dengan nama kolom di database Anda
  const hasAccess = permission ? permission[action] === true : false;

  // console.log(
  //   `Checking Menu: ${menuKey} | Action: ${action} | Has Access: ${hasAccess}`,
  // );

  if (!hasAccess) return null;

  return <>{children}</>;
};

export default PermissionGate;
