"use client";

import { LuPlus } from "react-icons/lu";
import { useEffect, useState } from "react";
import { Button, toast } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAxios } from "@/hooks";
import { NoData } from "@/components/no-data";
import { ApplicationCard } from "@/components/cards";
import { BreadCrumb } from "@/components/bread-crumb";
import { RegisterAppModal } from "@/components/modals";
import { useGlobalState, useModalState } from "@/stores";

export default function ApplicationsPage() {
  const { interceptor } = useAxios();
  const { showModal } = useModalState();
  const { setIsProgress } = useGlobalState();
  const queryClient = useQueryClient();

  const [selectedApplication, setSelectedApplication] = useState<IApplication>();
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
          queryClient.setQueryData<IApplication[]>(["applications"], (app = []) => app.filter((i) => i._id !== _id));
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setDeletingApplicationId(undefined);
        }
      },
    });
  };

  const {
    data: applications = [],
    isPending,
    isFetching,
  } = useQuery<IApplication[]>({
    queryKey: ["applications"],
    queryFn: async () => {
      try {
        const response = await interceptor.get("/applications");
        return response.data;
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
        throw error;
      }
    },
  });

  useEffect(() => {
    setIsProgress(isFetching);
    return () => setIsProgress(false);
  }, [isFetching, setIsProgress]);

  return (
    <div className="space-y-8">
      <BreadCrumb title="Applications" description="Manage third-party applications that have access to your account.">
        <Button onPress={() => setApplicationRegisterOpen(true)}>
          <LuPlus size={16} /> Register Application
        </Button>
      </BreadCrumb>
      {!isPending && applications.length === 0 && <NoData title="No applications found" />}
      {!isPending && applications.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              onEdit={(value) => {
                setSelectedApplication(value);
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
          application={selectedApplication}
          onOpenChange={(value) => {
            setApplicationRegisterOpen(value);
            setSelectedApplication(undefined);
          }}
          onSuccess={(app) => queryClient.setQueryData<IApplication[]>(["applications"], (old = []) => [app, ...old])}
          onEditSuccess={(app) =>
            queryClient.setQueryData<IApplication[]>(["applications"], (old = []) =>
              old.map((item) => (item._id === app._id ? app : item)),
            )
          }
        />
      )}
    </div>
  );
}
