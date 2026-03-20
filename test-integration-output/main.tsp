
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace IntegrationTest;

/**
 * Test event model
 */
model TestEvent {
	id: string;
	timestamp: utcDateTime;
	data: string;
}

/**
 * Test operation
 */
@channel("test.events")
@publish
op publishTestEvent(): TestEvent;
