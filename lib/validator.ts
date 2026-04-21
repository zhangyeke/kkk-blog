
// 图片正则
export const imageReg = /.+(\.(gif|png|jpg|jpeg|webp|svg|psd|bmp|tif))$/i;
// 判断是否为图片类型
export const isImage = (extension: string) => imageReg.test(extension);

// 图片校验器

// 视频正则
export const videoRegex = /\.(mp4|avi|mov|mkv|webm)$/i;

export const isVideo = (filename: string) => videoRegex.test(filename);

// 视频校验器

// 数字带单位正则
export const numUnitReg = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?(px|rem|%?)$/;

// 数字正则
export const numberReg = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;

//验证十进制数字
export const isNumber = (value: string | number) => numberReg.test(value.toString());

