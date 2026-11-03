package com.starlight.eurekaserver;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class EurekaServerApplicationTests {

    @Test
    void mainApplicationClassLoads() {
        assertNotNull(EurekaServerApplication.class);
    }
}
