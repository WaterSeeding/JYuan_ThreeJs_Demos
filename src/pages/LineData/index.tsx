import styles from './index.less';
import { useEffect, useState } from 'react';
import lineJson from './json/line.json';
import bohailineJson from './json/渤海路线.json';
import donghailineJson from './json/东海线路.json';
import nanhaixilineJson from './json/南海西部路线.json';
import nanhaidonglineJson from './json/南海东部路线.json';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  // 渤海 185
  // 东海 24
  // 南海东部 51
  // 南海西部 73
  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      console.log('lineJson', lineJson.features.length);
      console.log('bohailineJson', bohailineJson.features.length);
      console.log('donghailineJson', donghailineJson.features.length);
      console.log('nanhaixilineJson', nanhaixilineJson.features.length);
      console.log('nanhaidonglineJson', nanhaidonglineJson.features.length);
    }
  }, []);

  return <div className={styles.container}></div>;
};

export default Earth;
