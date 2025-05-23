import Markdium from "./plugins/markdium.js";
import blankTutorials from "./plugins/blankTutorials.js";

const Blanket = async function () {
  const plugins = {
    Markdium,
    blankTutorials,
  };

  for (const [name, plugin] of Object.entries(plugins)) {
    if (plugin && typeof plugin.init === "function") {
      try {
        const result = plugin.init();
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`❌ ${name} failed to initialize:`, error);
      }
    }
  }
};

export default Blanket;
