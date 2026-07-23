"use client";

import { useEffect, useState } from "react";
import { Chip, toast } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAxios } from "@/hooks";
import { NoData } from "@/components/no-data";
import { DeviceCard } from "@/components/cards";
import { BreadCrumb } from "@/components/bread-crumb";
import { useGlobalState, useModalState } from "@/stores";

export default function DevicesPage() {
  const { interceptor } = useAxios();
  const { showModal } = useModalState();
  const { setIsProgress } = useGlobalState();
  const queryClient = useQueryClient();

  const [signingOutDeviceId] = useState<string | undefined>(undefined);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | undefined>(undefined);

  const handleRemoveDevice = async (device: IDevice) => {
    const { model, _id } = device;
    showModal({
      title: "Remove Device",
      description: `Are you sure you want to permanently delete '${model}'? It will be signed out instantly and lose all access to this account.`,
      status: "danger",
      onConfirm: async () => {
        setRemovingDeviceId(_id);
        try {
          const response = await interceptor.delete(`/user/devices/delete/${_id}`);
          queryClient.setQueryData<IDevice[]>(["user-devices"], (devices) => {
            if (!devices) return [];
            return devices.filter((d) => d._id !== _id);
          });
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setRemovingDeviceId(undefined);
        }
      },
    });
  };

  const {
    data: devices = [],
    isPending,
    isFetching,
  } = useQuery<IDevice[]>({
    queryKey: ["user-devices"],
    queryFn: async () => {
      try {
        const response = await interceptor.get("/user/devices");
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
      <BreadCrumb title="Active Devices" description="Manage all devices that are signed in to your account.">
        {devices.length > 0 && (
          <Chip size="sm" className="bg-blue-500/15 text-blue-700 dark:text-blue-400">
            {devices.length} device(s)
          </Chip>
        )}
      </BreadCrumb>
      {!isPending && devices.length === 0 && <NoData title="No devices found" />}
      {!isPending && devices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device: IDevice) => (
            <DeviceCard
              key={device._id}
              device={device}
              onRemove={handleRemoveDevice}
              isRemovingDevice={removingDeviceId === device._id}
              isSigningOutDevice={signingOutDeviceId === device._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
