import React from "react";

export const CardContext = React.createContext({
  stages: [],
  stagesId: null,
  setStage: () => {},
  setStagesId: () => {},
});
