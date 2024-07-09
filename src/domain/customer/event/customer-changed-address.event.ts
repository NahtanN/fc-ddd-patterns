import EventInterface from "../../@shared/event/event.interface";
import Customer from "../entity/customer";
import Address from "../value-object/address";

export default class CustomerChandedAddressEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: Omit<Customer, "active" | "rewardPoints">;

  constructor(eventData: any) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
