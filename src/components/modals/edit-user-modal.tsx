import { Fragment } from "react";
import { useFormik } from "formik";
import { LuPen } from "react-icons/lu";
import { Avatar, Button, Chip, cn, Form, Modal, Spinner, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { NoData } from "../no-data";
import { Utils } from "@/lib/utils";
import { permissions } from "@/permissions";

const ALL_STATUSES: IUser["status"][] = ["active", "suspended"];
const ALL_ROLES: IUser["role"][] = ["superadmin", "admin", "user"];

interface Props {
  user?: IUser;
  isOpen: boolean;
  onConfigurePermissions: () => void;
  onOpenChange: (value: boolean) => void;
  onUpdateSuccess: (value: IUser) => void;
}

export const EditUserModal: React.FC<Props> = (props) => {
  const { interceptor } = useAxios();

  const user = props.user;
  const permissionLabels = Utils.instance.valueToLabel(
    user?.permissions,
    permissions.flatMap((c) => c.permissions),
  ) as string[];

  const formik = useFormik({
    initialValues: { role: user?.role ?? "user", status: user?.status ?? "active", permissions: user?.permissions },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const response = await interceptor.put(`admin/users/${user?._id}`, values);
        props.onUpdateSuccess(response.data);
        props.onOpenChange(false);
        toast.success("User account has been updated");
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.manage);
      }
    },
  });

  if (!user) return null;

  return (
    <Modal.Backdrop isOpen={props.isOpen} onOpenChange={props.onOpenChange} variant="blur">
      <Modal.Container size="sm">
        <Modal.Dialog aria-label="Edit User">
          <Modal.CloseTrigger />
          <Modal.Header>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <Avatar.Image src={user.avatar} alt={user.fullname} />
                <Avatar.Fallback>{user.fullname.charAt(0)}</Avatar.Fallback>
              </Avatar>
              <div>
                <p className="text-foreground text-sm font-semibold">{user?.fullname}</p>
                <p className="text-muted text-xs">{user.identifier}</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body>
            <Form validationBehavior="aria" className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-foreground text-sm font-medium">Role</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_ROLES.map((role) => (
                    <Button
                      fullWidth
                      key={role}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "text-muted hover:border-accent/50 rounded-xl py-2 text-xs capitalize transition-all",
                        {
                          "bg-accent text-accent-foreground border-accent": formik.values.role === role,
                        },
                      )}
                      onPress={() => formik.setFieldValue("role", role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-foreground text-sm font-medium">Account Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_STATUSES.map((status) => (
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      className={`rounded-xl border py-2 text-xs capitalize transition-all ${
                        formik.values.status === status
                          ? status === "active"
                            ? "bg-success/20 text-success border-success"
                            : "border-red-500 bg-red-500/20 text-red-500"
                          : "border-border text-muted hover:border-accent/50"
                      }`}
                      onPress={() => formik.setFieldValue("status", status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-sm font-medium">Permissions</p>
                  <Button isIconOnly size="sm" variant="ghost" onPress={props.onConfigurePermissions}>
                    <LuPen className="text-muted h-3 w-3" />
                  </Button>
                </div>
                {user.permissions.length > 0 ? (
                  <div className="bg-default-50 mt-1 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-dashed p-3">
                    {permissionLabels.map((label, index) => (
                      <Chip key={index} size="sm" className="text-muted px-2 text-xs">
                        {label}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <NoData
                    showIcon={false}
                    title="No Permissions Configured"
                    description="This user currently has no system permissions assigned. Select permissions below to grant them access."
                    className="p-4"
                  />
                )}
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">
              Cancel
            </Button>
            <Button isPending={formik.isSubmitting} onPress={() => formik.handleSubmit()}>
              {({ isPending }) => (
                <Fragment>
                  {isPending && <Spinner size="sm" color="current" />}
                  Save Changes
                </Fragment>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
