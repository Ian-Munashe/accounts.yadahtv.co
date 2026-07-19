"use client";

import { LuPlus } from "react-icons/lu";
import { useEffect, useState } from "react";
import { Button, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { NoData } from "@/components/no-data";
import { ApplicationCard } from "@/components/cards";
import { BreadCrumb } from "@/components/bread-crumb";
import { RegisterAppModal } from "@/components/modals";
import { useGlobalState, useModalState } from "@/stores";

export default function ApplicationsPage() {
  const { interceptor } = useAxios();
  const { showModal } = useModalState();
  const { isProgress, setIsProgress } = useGlobalState();

  const [application, setApplication] = useState<IApplication>();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [applicationRegisterOpen, setApplicationRegisterOpen] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | undefined>(undefined);

  const handleDeleteApplication = async (application: IApplication) => {
    const { clientId, _id } = application;
    showModal({
      title: "Revoke Application Access?",
      description: `Are you sure you want to permanently delete '${clientId}'? This action cannot be undone, and the application will immediately lose access to all services.`,
      status: "danger",
      onConfirm: async () => {
        setDeletingApplicationId(_id);
        try {
          const response = await interceptor.delete(`/applications/${_id}`);
          setApplications((prev) => prev.filter((i) => i._id !== _id));
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setDeletingApplicationId(undefined);
        }
      },
    });
  };

  useEffect(() => {
    (async () => {
      setIsProgress(true);
      try {
        const response = await interceptor.get("/applications");
        setApplications(response.data);
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
      } finally {
        setIsProgress(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <BreadCrumb title="Applications" description="Manage third-party applications that have access to your account.">
        <Button onPress={() => setApplicationRegisterOpen(true)}>
          <LuPlus size={16} /> Register Application
        </Button>
      </BreadCrumb>
      {!isProgress && applications.length === 0 && <NoData title="No applications found" />}
      {!isProgress && applications.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              onEdit={(value) => {
                setApplication(value);
                setApplicationRegisterOpen(true);
              }}
              onDelete={handleDeleteApplication}
              isDeleting={deletingApplicationId === application._id}
            />
          ))}
        </div>
      )}
      {applicationRegisterOpen && (
        <RegisterAppModal
          isOpen={applicationRegisterOpen}
          application={application}
          onOpenChange={(value) => {
            setApplicationRegisterOpen(value);
            setApplication(undefined);
          }}
          onSuccess={(application) => setApplications((prev) => [application, ...prev])}
          onEditSuccess={(application) =>
            setApplications((prev) => prev.map((i) => (i._id === application._id ? application : i)))
          }
        />
      )}
    </div>
  );
}
