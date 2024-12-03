//----------- A function to remove undefined fields in an object -----------//
export const removeUndefinedFields = (obj: any) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
};
