export interface ImageConfig {
  image: {
    plantumlEndpoint: string;
    imageType: ImageType;
  };
}

export enum ImageType {
  PNG = "png",
  SVG = "svg",
  ASCII_ART = "txt",
}
