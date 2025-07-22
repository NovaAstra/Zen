
<script>
import { unmountGlobalLoading } from "@/utilties";

export default {
  name: "App",
  mounted() {
    unmountGlobalLoading();
  },
  render(){
    return <div>12312</div>
  }
};
</script>
