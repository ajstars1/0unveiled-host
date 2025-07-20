import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Welcome to{" "}
              <span className="bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                0Unveiled
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Experience the future with our AI-powered platform. Unleash
              creativity, boost productivity, and transform your ideas into
              reality.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to build the future
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI-Powered",
                description:
                  "Leverage cutting-edge AI technology for better results",
              },
              {
                title: "Scalable",
                description:
                  "Built to grow with your needs and handle any load",
              },
              {
                title: "Secure",
                description: "Enterprise-grade security to protect your data",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative rounded-lg border bg-card p-8 shadow-sm"
              >
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
