import "@typespec/http";

// Test a working decorator from standard library to understand pattern
@route("/")
@get
op testOp(): void;