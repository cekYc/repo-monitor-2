import Image, { type ImageProps } from "next/image";

type GitHubAvatarProps = Omit<ImageProps, "src" | "alt" | "unoptimized"> & {
  src: string;
  alt: string;
  identity?: string;
};

/**
 * GitHub avatars are already served in an appropriate size by GitHub's CDN.
 * Loading them directly also keeps Next's shared image optimizer cache from
 * reusing one user's optimized response for another user's avatar.
 */
export default function GitHubAvatar({
  src,
  alt,
  identity = alt,
  ...props
}: GitHubAvatarProps) {
  return (
    <Image
      key={`${identity}:${src}`}
      src={src}
      alt={alt}
      unoptimized
      {...props}
    />
  );
}
