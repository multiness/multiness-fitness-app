import { Button } from "@/components/ui/button";

interface MarketingBannerProps {
  banner: {
    name: string;
    description: string;
    webImage: string;
    buttons: Array<{
      text: string;
      url: string;
    }>;
  };
}

export function MarketingBanner({ banner }: MarketingBannerProps) {
  return (
    <div className="relative w-full">
      {/* Banner Image */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-lg">
        <img
          src={banner.webImage}
          alt={banner.name}
          className="object-cover w-full h-full"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
                {banner.name}
              </h2>
              <p className="text-white/90 md:text-xl">
                {banner.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {banner.buttons.map((button, index) => (
                  <Button
                    key={index}
                    variant={index === 0 ? "default" : "secondary"}
                    size="lg"
                    className={`font-bold ${
                      index === 0 
                        ? "bg-primary hover:bg-primary/90 text-white" 
                        : "bg-white hover:bg-white/90 text-black"
                    }`}
                    onClick={() => window.open(button.url, '_blank')}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}