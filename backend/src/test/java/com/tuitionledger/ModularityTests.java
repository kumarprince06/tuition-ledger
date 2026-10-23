package com.tuitionledger;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {

	ApplicationModules modules = ApplicationModules.of(BackendApplication.class);

	@Test
	void verifiesModuleBoundaries() {
		modules.verify();
	}

	@Test
	void detectsAllModulesFromLld() {
		assertThat(modules.stream().map(m -> m.getBasePackage().getLocalName()))
				.containsExactlyInAnyOrder("tenancy", "academics", "students", "fees", "ledger",
						"messaging", "integrations", "reporting", "platform", "shared");
	}

}
