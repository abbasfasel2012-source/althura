declare module "pdf-parse" {
  type PdfData = { text: string; numpages: number };
  function parse(data: Buffer | Uint8Array): Promise<PdfData>;
  export default parse;
}
