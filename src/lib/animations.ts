import { Transition, Variants } from "framer-motion";

const stepFade: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const stepFadeTransition: Transition = {
  duration: 0.35,
  ease: "easeOut",
};

export const stepFadeAnimation = {
  ...stepFade,
  transition: stepFadeTransition,
};
