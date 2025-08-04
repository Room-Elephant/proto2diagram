import { simplePuml } from "../tests/input/puml";
import { imageGenerator } from "./imageGenerator";
import { ImageType } from "./type";

describe("Image generator", () => {
  const defaultConfig = {
    image: {
      plantumlEndpoint: "http://www.plantuml.com/plantuml/",
      imageType: ImageType.PNG,
    },
  };
  it("should generate an image url for a png", () => {
    defaultConfig.image.imageType = ImageType.PNG;
    const victim = imageGenerator(defaultConfig);
    const result = victim.generateImageUrl(simplePuml);

    expect(result).toBe(
      "http://www.plantuml.com/plantuml/png/ut8eBaaiAYdDpU5opCbCJbNGjLDmoa-oKd0iBSb8pIl9J4uioSpFKmXABInDBIxX0iefw0BLW1LZKLLSa9zNdChba9gN0Z8J0000",
    );
  });
  it("should generate an image url for a svg", () => {
    defaultConfig.image.imageType = ImageType.SVG;
    const victim = imageGenerator(defaultConfig);
    const result = victim.generateImageUrl(simplePuml);

    expect(result).toBe(
      "http://www.plantuml.com/plantuml/svg/ut8eBaaiAYdDpU5opCbCJbNGjLDmoa-oKd0iBSb8pIl9J4uioSpFKmXABInDBIxX0iefw0BLW1LZKLLSa9zNdChba9gN0Z8J0000",
    );
  });
  it("should generate an image url for a ascii art", () => {
    defaultConfig.image.imageType = ImageType.ASCII_ART;
    const victim = imageGenerator(defaultConfig);
    const result = victim.generateImageUrl(simplePuml);

    expect(result).toBe(
      "http://www.plantuml.com/plantuml/txt/ut8eBaaiAYdDpU5opCbCJbNGjLDmoa-oKd0iBSb8pIl9J4uioSpFKmXABInDBIxX0iefw0BLW1LZKLLSa9zNdChba9gN0Z8J0000",
    );
  });
});
