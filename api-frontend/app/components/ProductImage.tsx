"use client";

import { useMemo, useState } from "react";
import { PRODUCT_PLACEHOLDER_SRC } from "../lib/constants";
import { useEffect } from "react";

type ProductImageProps = {
    src?: string | null;
    alt: string;
    className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
    const normalizedSrc = useMemo(() => {
        const trimmed = (src ?? "").trim();
        return trimmed.length > 0 ? trimmed : PRODUCT_PLACEHOLDER_SRC;
    }, [src]);

    const [effectiveSrc, setEffectiveSrc] = useState<string>(normalizedSrc);

    useEffect(() => {
        setEffectiveSrc(normalizedSrc);
    }, [normalizedSrc]);

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={effectiveSrc}
            alt={alt}
            className={className}
            onError={() => setEffectiveSrc(PRODUCT_PLACEHOLDER_SRC)}
        />
    );
}
