import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import CustomerChandedAddressEvent from "../customer-changed-address.event";

export default class SendWhenCustomerAddressChandedHandler
  implements EventHandlerInterface<CustomerChandedAddressEvent>
{
  handle(event: CustomerChandedAddressEvent): void {
    const { id, name, Address } = event.eventData;
    console.log(
      `Endereço do cliente: ${id}, ${name} alterado para: ${Address.toString()}`,
    );
  }
}
