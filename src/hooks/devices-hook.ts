import { useState } from "react";
import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";

import { useAxios } from "./axios-hook";
import { useModalState } from "@/stores";

export const useDevices = () => {
  const { interceptor } = useAxios();
  const { showModal } = useModalState();
  const queryClient = useQueryClient();

  const [signOutId, setSignId] = useState<string | undefined>(undefined);
  const [removeId, setRemoveId] = useState<string | undefined>(undefined);

  const removeDevice = async (device: IDevice) => {
    const { model, _id } = device;
    showModal({
      title: "Remove Device",
      description: `Are you sure you want to permanently delete '${model}'? It will be signed out instantly and lose all access to this account.`,
      status: "danger",
      onConfirm: async () => {
        setRemoveId(_id);
        try {
          const response = await interceptor.delete(`/devices/${_id}`);
          queryClient.setQueryData<IDevice[]>(["user-devices"], (devices) => {
            if (!devices) return [];
            return devices.filter((d) => d._id !== _id);
          });
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setRemoveId(undefined);
        }
      },
    });
  };

  const signOutDevice = async (device: IDevice) => {
    const { model, _id } = device;
    showModal({
      title: "Sign Out Device",
      description: `Are you sure you want to sign out '${model}'? It will lose access to this account until it signs in again.`,
      status: "danger",
      onConfirm: async () => {
        setSignId(_id);
        try {
          const response = await interceptor.put(`/devices/signout/${_id}`);
          queryClient.setQueryData<IDevice[]>(["user-devices"], (devices) => {
            if (!devices) return [];
            return devices.map((d) => (d._id === _id ? { ...d, loggedIn: false } : d));
          });
          toast.success(response.data.message);
        } catch (error: any) {
          toast.danger(error.response?.data?.message || error.message);
        } finally {
          setSignId(undefined);
        }
      },
    });
  };

  return { removeDevice, signOutDevice, signOutId, removeId };
};
