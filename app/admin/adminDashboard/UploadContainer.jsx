import UploadMTSA from "./UploadMTSA";
import UploadTNSoccer from "./UploadTNSoccer";

function UploadContainer() {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1, padding: "10px" }}>
        <UploadTNSoccer />
      </div>
      <div style={{ flex: 1, padding: "10px" }}>
        <UploadMTSA />
      </div>
    </div>
  );
}

export default UploadContainer;
