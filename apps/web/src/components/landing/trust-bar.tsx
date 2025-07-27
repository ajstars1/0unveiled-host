export default function TrustBar() {
  return (
    <section className="w-full py-6 border-y bg-muted/50">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-sm font-medium">Trusted by students from:</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-10">
            {["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kharagpur", "IIT Kanpur"].map((institute) => (
              <div key={institute} className="flex items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground">{institute}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
