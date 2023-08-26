export interface GetS3Options {
  data: {
    s3_url: {
      url: string;
      fields: { [key: string]: string };
    };
    selfLink: string;
  };
};