import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import React from "react";

interface Slide {
  index: number;
  scrollProgress: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ICarouselContext {
  itemsCount: number;
  setItemsCount: React.Dispatch<React.SetStateAction<number>>;
  currentSlide: Slide;
  setCurrentSlide: React.Dispatch<React.SetStateAction<Slide>>;
  isEndScroll: boolean;
  setIsEndScroll: React.Dispatch<React.SetStateAction<boolean>>;
  navigateToSlide: (index: number) => void;
}

const CarouselContext = React.createContext({} as ICarouselContext);

const useCarouselContext = () => React.useContext(CarouselContext);

type CarouselRootProps = React.ComponentPropsWithoutRef<"section">;

const CarouselRoot: React.FC<CarouselRootProps> = ({
  children,
  className,
  ...props
}) => {
  const [itemsCount, setItemsCount] = React.useState(0);
  const [currentSlide, setCurrentSlide] = React.useState<Slide>({
    index: 0,
    scrollProgress: 0,
  });

  const [isEndScroll, setIsEndScroll] = React.useState(true);

  const rootRef = React.useRef<HTMLDivElement>(null);

  const navigateToSlide = (index: number) => {
    if (!rootRef.current) return;

    const gallery = rootRef.current.querySelector("#carousel_gallery");

    if (!gallery) return;

    const scrollLeft = Array.from({ length: index }).reduce<number>(
      (acc, _, i) => {
        const child = gallery.children[i];
        return acc + child?.clientWidth || 0;
      },
      0
    );

    gallery.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  };

  return (
    <CarouselContext.Provider
      value={{
        itemsCount,
        setItemsCount,
        currentSlide,
        isEndScroll,
        setIsEndScroll,
        navigateToSlide,
        setCurrentSlide,
      }}
    >
      <section
        ref={rootRef}
        className={cn("w-full flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  );
};

type CarouselGalleryProps = React.ComponentPropsWithoutRef<"div">;

const CarouselGallery: React.FC<CarouselGalleryProps> = ({
  children,
  className,
  ...props
}) => {
  const { itemsCount, setItemsCount, setCurrentSlide, setIsEndScroll } =
    useCarouselContext();

  const childrenCount = React.Children.count(children);

  React.useEffect(() => {
    setItemsCount(childrenCount);
  }, [childrenCount, setItemsCount]);

  const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const gallery = event.currentTarget;
    const childList = Array.from(gallery.children);

    let leftPosition = 0;
    const firstSlideIndex = childList.findIndex((child) => {
      leftPosition += child.clientWidth;
      const isFirst = leftPosition > gallery.scrollLeft;
      return isFirst;
    });

    const isEndScroll =
      Math.ceil(gallery.clientWidth + gallery.scrollLeft) >=
      gallery.scrollWidth;

    setIsEndScroll(isEndScroll);

    if (isEndScroll) {
      setCurrentSlide({
        index: itemsCount - 1,
        scrollProgress: 1,
      });
      return;
    }

    if (firstSlideIndex < 0) return;

    const scrollProgress =
      (leftPosition - gallery.scrollLeft) /
      childList[firstSlideIndex].clientWidth;

    setCurrentSlide({ index: firstSlideIndex, scrollProgress });
  };

  return (
    <div
      id={"carousel_gallery"}
      onScroll={onScroll}
      className={cn(
        "flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

type CarouselSlideProps = React.ComponentPropsWithoutRef<"div">;

const CarouselSlide: React.FC<CarouselSlideProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("snap-start", className)} {...props}>
      {children}
    </div>
  );
};

type CarouselPaginationBarContainerProps =
  React.ComponentPropsWithoutRef<"div">;

const CarouselPaginationBarContainer: React.FC<
  CarouselPaginationBarContainerProps
> = ({ className, ...props }) => {
  return (
    <div className={cn("flex justify-center items-center gap-2")} {...props} />
  );
};

interface CarouselPaginationArrowProps
  extends React.ComponentPropsWithoutRef<"button"> {
  direction?: "left" | "right";
}

const CarouselPaginationArrow: React.FC<CarouselPaginationArrowProps> = ({
  direction = "left",
  className,
  ...props
}) => {
  const { navigateToSlide, currentSlide, itemsCount, isEndScroll } =
    useCarouselContext();

  const arrowNavigate = () => {
    if (direction === "left") {
      const previousSlideIndex =
        currentSlide.index <= 0 ? 0 : currentSlide.index - 1;

      navigateToSlide(previousSlideIndex);
    } else {
      const nextSlideIndex =
        currentSlide.index >= itemsCount - 1
          ? itemsCount - 1
          : currentSlide.index + 1;

      navigateToSlide(nextSlideIndex);
    }
  };

  const isDisabled =
    direction === "left"
      ? currentSlide.index <= 0
      : currentSlide.index >= itemsCount - 1 || isEndScroll;

  return (
    <button
      className={cn(
        "p-1 rounded-full transition-all text-primary-100",
        direction === "left" && "rotate-180",
        !isDisabled && "hover:bg-primary-50 hover:text-primary-600",
        !isDisabled && direction === "left" && "hover:-translate-x-1",
        !isDisabled && direction === "right" && "hover:translate-x-1",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      <ChevronRight onClick={arrowNavigate} />
    </button>
  );
};

type CarouselPaginationDotsProps = React.ComponentPropsWithoutRef<"button">;

const CarouselPaginationDots: React.FC<CarouselPaginationDotsProps> = ({}) => {
  const { itemsCount, currentSlide, navigateToSlide } = useCarouselContext();

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: itemsCount }).map((_, index) => {
        const isSelected = index === currentSlide.index;
        const isAfterSelected = index - 1 === currentSlide.index;

        const minWidth = 8;
        const maxSelectedWidth = 32;

        const percentageWidth = isSelected
          ? currentSlide.scrollProgress
          : isAfterSelected
          ? 1 - currentSlide.scrollProgress
          : 0;
        const increasedWidth = percentageWidth * (maxSelectedWidth - minWidth);

        const width = minWidth + increasedWidth;

        return (
          <button
            key={index}
            onClick={() => navigateToSlide(index)}
            style={{
              width,
              minWidth,
            }}
            className={cn(
              "rounded-full h-2 bg-primary-100 transition-colors",
              isAfterSelected && increasedWidth > 0 && "bg-primary-300",
              isSelected ? "bg-primary-500" : "hover:bg-primary-200"
            )}
          />
        );
      })}
    </div>
  );
};

type CarouselPaginationProps = React.ComponentPropsWithoutRef<"div">;

const CarouselPaginationBar: React.FC<CarouselPaginationProps> = ({
  className,
  children,
  ...props
}) => {
  if (children)
    return (
      <CarouselPaginationBarContainer className={className} {...props}>
        {children}
      </CarouselPaginationBarContainer>
    );

  return (
    <CarouselPaginationBarContainer {...props}>
      <CarouselPaginationArrow />
      <CarouselPaginationDots />
      <CarouselPaginationArrow direction="right" />
    </CarouselPaginationBarContainer>
  );
};

export const Carousel = {
  Root: CarouselRoot,
  Gallery: CarouselGallery,
  Slide: CarouselSlide,
  PaginationBar: CarouselPaginationBar,
  Arrow: CarouselPaginationArrow,
  useCarouselContext,
  Dots: CarouselPaginationDots,
};
