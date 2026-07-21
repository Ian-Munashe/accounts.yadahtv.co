"use client";

import { useEffect, useState } from "react";
import { Chip, toast } from "@heroui/react";

import { useAxios } from "@/hooks";
import { NoData } from "@/components/no-data";
import { DeviceCard } from "@/components/cards";
import { BreadCrumb } from "@/components/bread-crumb";
import { useGlobalState, useModalState } from "@/stores";

export default function DevicesPage() {
  const { interceptor } = useAxios();
  const { showModal } = useModalState();
  const { isProgress, setIsProgress } = useGlobalState();

  const [devices, setDevices] = useState<IDevice[]>([]);
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
          setDevices((prev) => prev.filter((i) => i._id !== _id));
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setRemovingDeviceId(undefined);
        }
      },
    });
  };

  useEffect(() => {
    (async () => {
      setIsProgress(true);
      try {
        const response = await interceptor.get("/user/devices");
        setDevices(response.data);
      } catch (error: any) {
        toast.danger(error.response?.data?.message || error.message);
      } finally {
        setIsProgress(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <BreadCrumb title="Active Devices" description="Manage all devices that are signed in to your account.">
        {devices.length > 0 && (
          <Chip size="sm" className="bg-blue-500/15 text-blue-700 dark:text-blue-400">
            {devices.length} device(s)
          </Chip>
        )}
      </BreadCrumb>
      {!isProgress && devices.length === 0 && <NoData title="No devices found" />}
      {!isProgress && devices.length > 0 && (
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
