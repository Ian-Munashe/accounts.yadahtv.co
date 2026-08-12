"use client";

import { useEffect } from "react";
import { Chip, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { useGlobalState } from "@/stores";
import { NoData } from "@/components/no-data";
import { useAxios, useDevices } from "@/hooks";
import { DeviceCard } from "@/components/cards";
import { BreadCrumb } from "@/components/bread-crumb";

export default function DevicesPage() {
  const { interceptor } = useAxios();
  const { setIsProgress } = useGlobalState();
  const { signOutId, removeId, removeDevice, signOutDevice } = useDevices();

  const {
    data: devices = [],
    isPending,
    isFetching,
  } = useQuery<IDevice[]>({
    queryKey: ["user-devices"],
    queryFn: async () => {
      try {
        const response = await interceptor.get("/devices");
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
              onRemove={removeDevice}
              onSignOut={signOutDevice}
              isRemovingDevice={removeId === device._id}
              isSigningOutDevice={signOutId === device._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
