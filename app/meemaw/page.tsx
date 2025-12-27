import MeemawLeft from "../_components/meemaw-left";
 import MeemawRight from "../_components/meemaw-right";

export default function MeemawPage() {
  return (
    <>
      <div className="h-[100dvh] w-full overflow-hidden bg-black lg:flex">
        <div className="w-full lg:w-[430px] lg:shrink-0 lg:pl-0">
          <MeemawLeft />
        </div>

        <div className="hidden flex-1 lg:block" />
      </div>

      <MeemawRight />
    </>
  );
}
