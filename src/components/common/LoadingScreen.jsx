import React from 'react';
import { AdvancedLogoLoader } from './AdvancedLogoLoader';

export const LoadingScreen = ({
  message = 'Loading Tech Wash...',
  subtext = 'Next-Gen Premium Garment Care',
  dark = false,
  showProgress = true,
  showDynamicStages = false,
}) => {
  return (
    <AdvancedLogoLoader
      size="lg"
      text={message}
      subtext={subtext}
      fullScreen={true}
      dark={dark}
      showProgress={showProgress}
      showDynamicStages={showDynamicStages}
    />
  );
};
