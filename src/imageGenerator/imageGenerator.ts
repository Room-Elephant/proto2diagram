import { encode } from "./plantumlEncoder";
import { ImageConfig } from "./type";

export const imageGenerator = (config: ImageConfig) => {
  function generateImageUrl(puml: string): string {
    const result = encode(puml);

    return `${config.image.plantumlEndpoint}${config.image.imageType}/${result}`;
  }

  return { generateImageUrl };
};
