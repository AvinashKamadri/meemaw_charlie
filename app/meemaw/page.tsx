import MeemawLeft from "../_components/meemaw-left";

export default function MeemawPage() {
  return (
    <div className="min-h-screen w-full bg-black lg:flex">
      <div className="w-full lg:w-[430px] lg:shrink-0 lg:pl-10">
        <MeemawLeft />
      </div>

      <div className="hidden flex-1 lg:block" />
    </div>
  );
}
