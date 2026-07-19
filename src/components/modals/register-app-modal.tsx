import { useFormik } from "formik";
import { useState, Fragment } from "react";
import { Button, cn, Form, Modal, Spinner, toast } from "@heroui/react";
import { LuAppWindow, LuGlobe, LuSmartphone, LuCode, LuMonitor } from "react-icons/lu";

import { useAxios } from "@/hooks";
import { TextArea, TextField } from "../inputs";
import { ApplicationValidationSchema } from "@/validations";

interface Props {
  isOpen: boolean;
  application?: IApplication;
  onOpenChange?: (value: boolean) => void;
  onEditSuccess: (value: any) => void;
  onSuccess: (value: IApplication) => void;
}

const TypeIcon = ({ type }: { type: IApplication["type"] }) => {
  const cls = "text-accent";
  const size = 20;
  switch (type) {
    case "web":
      return <LuGlobe size={size} className={cls} />;
    case "mobile":
      return <LuSmartphone size={size} className={cls} />;
    case "api":
      return <LuCode size={size} className={cls} />;
    case "desktop":
      return <LuMonitor size={size} className={cls} />;
    default:
      return <LuAppWindow size={size} className={cls} />;
  }
};

const types: IApplication["type"][] = ["web", "mobile", "api", "desktop"];

export const RegisterAppModal: React.FC<Props> = (props) => {
  const { interceptor } = useAxios();
  const isEditing = props.application;

  const [type, setType] = useState<IApplication["type"]>(props.application?.type ?? "web");

  const formik = useFormik({
    initialValues: {
      type,
      clientId: props.application?.clientId ?? "",
      permissions: props.application?.permissions.join(",") ?? "",
    },
    validationSchema: ApplicationValidationSchema,
    onSubmit: async (values) => {
      try {
        const payload = { ...values, permissions: values.permissions.split(",") };
        const response = isEditing
          ? await interceptor.put(`/applications/${props.application?._id}`, payload)
          : await interceptor.post("/applications/register", payload);
        isEditing ? props.onEditSuccess(response.data.application) : props.onSuccess(response.data.application);
        props.onOpenChange?.(false);
        toast.success(response.data.message);
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
      }
    },
  });

  const handleSelectType = (type: IApplication["type"]) => {
    setType(type);
    formik.setFieldValue("type", type);
  };

  return (
    <Modal.Backdrop isOpen={props.isOpen} onOpenChange={props.onOpenChange} variant="blur">
      <Modal.Container size="sm">
        <Modal.Dialog aria-label="Register Application">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading slot="title">{isEditing ? "Edit" : "Register New"} Application</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={formik.handleSubmit} validationBehavior="aria" className="flex flex-col gap-5">
              <TextField
                formik={formik}
                label="Client ID"
                name="clientId"
                placeholder="e.g. my-app-web"
                prefix={<LuAppWindow size={15} className="text-muted" />}
              />
              <div className="flex flex-col gap-2">
                <p className="text-foreground text-sm font-medium">Application Type</p>
                <div className="grid grid-cols-4 gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSelectType(t)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium capitalize transition-all",
                        { "border-accent bg-default text-accent": type === t },
                      )}
                    >
                      <TypeIcon type={t} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <TextArea
                formik={formik}
                name="permissions"
                label="Permissions"
                placeholder="Comma-separated list using hyphens for spaces. Do not include spaces."
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">
              Cancel
            </Button>
            <Button isPending={formik.isSubmitting} onPress={() => formik.handleSubmit()}>
              {({ isPending }) => (
                <Fragment>
                  {isPending ? <Spinner color="current" size="sm" /> : null} {isEditing ? "Update" : "Register"}
                </Fragment>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
