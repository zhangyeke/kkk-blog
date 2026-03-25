import React from "react";
import {Button} from "@/components/ui/button";

export const SubmitButton: React.FC<{ children: React.ReactNode }> = ({
                                                                          children,
                                                                          ...props
                                                                      }) => {

    return <Button type="submit">{children}</Button>;
}
